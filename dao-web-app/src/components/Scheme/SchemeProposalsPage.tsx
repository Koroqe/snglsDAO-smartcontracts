import { History } from "history";
import { Address, IDAOState, IProposalStage, ISchemeState, Proposal, Vote, Reward, Scheme, Stake } from "@daostack/client";
import { enableWalletProvider, getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import Analytics from "lib/analytics";
import { schemeName } from "lib/schemeUtils";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { Link } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Observable, combineLatest } from "rxjs";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import classNames from "classnames";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import ProposalCard from "../Proposal/ProposalCard";
import * as css from "./SchemeProposals.scss";
import { withTranslation } from 'react-i18next';

// For infinite scrolling
const PAGE_SIZE = 100;

const Fade = ({ children, ...props }: any): any => (
  <CSSTransition
    {...props}
    timeout={1000}
    classNames={{
      enter: css.fadeEnter,
      enterActive: css.fadeEnterActive,
      exit: css.fadeExit,
      exitActive: css.fadeExitActive,
    }}
  >
    {children}
  </CSSTransition>
);

interface IExternalProps {
  currentAccountAddress: Address;
  history: History;
  isActive: boolean;
  scheme: ISchemeState;
  daoState: IDAOState;
}

interface IDispatchProps {
  showNotification: typeof showNotification;
}

type SubscriptionData = [Proposal[], Proposal[], Proposal[], Proposal[]];
type IProps = IExternalProps & IDispatchProps & ISubscriptionProps<SubscriptionData>;

const mapDispatchToProps = {
  showNotification,
};

class SchemeProposalsPage extends React.Component<IProps, null> {

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": Page.SchemeProposals,
      "DAO Address": this.props.daoState.address,
      "DAO Name": this.props.daoState.name,
      "Scheme Address": this.props.scheme.address,
      "Scheme Name": this.props.scheme.name,
    });
  }

  private async handleNewProposal(daoAvatarAddress: Address, schemeId: any): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    this.props.history.push(`/dao/scheme/${schemeId}/proposals/create/`);
  }

  private _handleNewProposal = (e: any): void => {
    this.handleNewProposal(this.props.daoState.address, this.props.scheme.id);
    e.preventDefault();
  };

  public render(): RenderOutput {
    //@ts-ignore
    const { t } = this.props;
    const { data } = this.props;

    const [proposalsQueued, proposalsPreBoosted, proposalsBoosted ] = data;
    const { currentAccountAddress, daoState, fetchMore, isActive, scheme } = this.props;
    let proposalCount=0;

    const queuedProposalsHTML = (
      <TransitionGroup className="queued-proposals-list">
        { proposalsQueued.map((proposal: Proposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={daoState} currentAccountAddress={currentAccountAddress} suppressTrainingTooltips={proposalCount++ > 0}/>
          </Fade>
        ))}
      </TransitionGroup>
    );

    proposalCount=0;

    const preBoostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsPreBoosted.map((proposal: Proposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={daoState} currentAccountAddress={currentAccountAddress} suppressTrainingTooltips={proposalCount++ > 0}/>
          </Fade>
        ))}
      </TransitionGroup>
    );

    proposalCount=0;

    const boostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsBoosted.map((proposal: Proposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={daoState} currentAccountAddress={currentAccountAddress} suppressTrainingTooltips={proposalCount++ > 0}/>
          </Fade>
        ))}
      </TransitionGroup>
    );

    const schemeFriendlyName = schemeName(scheme, scheme.address);

    return (
      <div>
        <BreadcrumbsItem to={`/dao/scheme/${scheme.id}`}>{schemeFriendlyName}</BreadcrumbsItem>

        { proposalsQueued.length === 0 && proposalsPreBoosted.length === 0 && proposalsBoosted.length === 0
          ?
          <div className={css.noDecisions}>
            <img className={css.relax} src="/assets/images/logo_white.svg"/>
            <div className={css.proposalsHeader}>
            {t("schemas.noUpcoming")}

            </div>
        <p>{t("schema.firstOneToCreate", {schemeFriendlyName: schemeFriendlyName})}</p>
            <div className={css.cta}>
              {
                schemeFriendlyName === "Grants" || schemeFriendlyName === "Protocol Parameters"
                ?
                <Link to={"/dao/dashboard"}>
                  <img className={css.relax} src="/assets/images/lt.svg"/> {t("schema.backToDashboard")}
                </Link>
                :
                <Link to={"/dao/applications"}>
                  <img className={css.relax} src="/assets/images/lt.svg"/>{t("schema.backToApp")}
                </Link>
              }

              <a className={classNames({
                [css.redButton]: true,
                [css.disabled]: !isActive,
              })}
              href="#!"
              onClick={isActive ? this._handleNewProposal : null}
              data-test-id="createProposal"
              >{t("schema.newProposal")}</a>
            </div>
          </div>
          :
          <div>
            <div className={css.boostedContainer}>
              <div className={css.proposalsHeader}>
                <TrainingTooltip placement="bottom" overlay={t("tooltips.boostedProposalPassed")}>
                  <span>{t("schema.firstOneToCreate", {boostedProposals: scheme.numberOfBoostedProposals})}</span>
                </TrainingTooltip>
                {proposalsBoosted.length === 0
                  ?
                  <div>
                    <img src="/assets/images/logo_icon.svg"/>
                  </div>
                  : " "
                }
              </div>
              <div className={css.proposalsContainer + " " + css.boostedProposalsContainer}>
                {boostedProposalsHTML}
              </div>
            </div>

            <div className={css.regularContainer}>
              <div className={css.proposalsHeader}>
                <TrainingTooltip placement="bottom" overlay={t("tooltips.pendingBoosted")}>
                  <span>{t('schema.pendingBoostedProposals', { num: scheme.numberOfPreBoostedProposals })}</span>
                </TrainingTooltip>
                {proposalsPreBoosted.length === 0
                  ?
                  <div>
                    <img src="/assets/images/logo_icon.svg"/>
                  </div>
                  : " "
                }
              </div>
              <div className={css.proposalsContainer}>
                {preBoostedProposalsHTML}
              </div>
            </div>
            <div className={css.regularContainer}>
              <div className={css.proposalsHeader}>
                <TrainingTooltip placement="bottom" overlay={t("tooltips.regProposalArePassedOrFailed")}>
                  <span>{t("schema.regularProposals", {num: scheme.numberOfQueuedProposals})}</span>
                </TrainingTooltip>
                {proposalsQueued.length === 0
                  ?
                  <div>
                    <img src="/assets/images/logo_icon.svg"/>
                  </div>
                  : " "
                }
              </div>
              <div className={css.proposalsContainer}>
                <InfiniteScroll
                  style={{overflow: "visible"}}
                  dataLength={proposalsQueued.length} //This is important field to render the next data
                  next={fetchMore}
                  hasMore={proposalsQueued.length < scheme.numberOfQueuedProposals}
                  loader={<h4>{t("schema.fetchingMore")}</h4>}
                  endMessage={
                    <p style={{textAlign: "center"}}>
                    </p>
                  }
                >
                  {queuedProposalsHTML}
                </InfiniteScroll>
              </div>
            </div>
          </div>
        }
      </div>
    );
  }
}

// For some reason there is a weird maybe bug in TypeScript where adding the functions for fetchingMOre
//   is causing it to misinterpret the type of the SubscriptionData, so have to manually specificy here
const SubscribedSchemeProposalsPage = withSubscription<IProps, SubscriptionData>({
  wrappedComponent: SchemeProposalsPage,
  loadingComponent: <Loading/>,
  errorComponent: null,

  checkForUpdate: (oldProps, newProps) => {
    return oldProps.scheme.id !== newProps.scheme.id;
  },

  createObservable: async (props: IExternalProps) => {
    const arc = getArc();
    const dao = props.daoState.dao;
    const schemeId = props.scheme.id;

    // this query will fetch al data we need before rendering the page, so we avoid hitting the server
    let bigProposalQuery;
    if (props.currentAccountAddress) {
      bigProposalQuery = gql`
        query ProposalDataForSchemeProposalsPage {
          proposals (where: {
            scheme: "${schemeId}"
            stage_in: [
              "${IProposalStage[IProposalStage.Boosted]}",
              "${IProposalStage[IProposalStage.PreBoosted]}",
              "${IProposalStage[IProposalStage.Queued]}"
              "${IProposalStage[IProposalStage.QuietEndingPeriod]}",
            ]
          }){
            ...ProposalFields
            votes (where: { voter: "${props.currentAccountAddress}"}) {
              ...VoteFields
            }
            stakes (where: { staker: "${props.currentAccountAddress}"}) {
              ...StakeFields
            }
            gpRewards (where: { beneficiary: "${props.currentAccountAddress}"}) {
              ...RewardFields
            }
          }
        }
        ${Proposal.fragments.ProposalFields}
        ${Vote.fragments.VoteFields}
        ${Stake.fragments.StakeFields}
        ${Reward.fragments.RewardFields}
        ${Scheme.fragments.SchemeFields}
      `;
    } else {
      bigProposalQuery = gql`
        query ProposalDataForSchemeProposalsPage {
          proposals (where: {
            scheme: "${schemeId}"
            stage_in: [
              "${IProposalStage[IProposalStage.Boosted]}",
              "${IProposalStage[IProposalStage.PreBoosted]}",
              "${IProposalStage[IProposalStage.Queued]}"
              "${IProposalStage[IProposalStage.QuietEndingPeriod]}",
            ]
          }){
            ...ProposalFields
          }
        }
        ${Proposal.fragments.ProposalFields}
        ${Scheme.fragments.SchemeFields}
      `;
    }

    return combineLatest(
      // the list of queued proposals
      dao.proposals({
        // eslint-disable-next-line @typescript-eslint/camelcase
        where: { scheme: schemeId, stage: IProposalStage.Queued },
        orderBy: "confidence",
        orderDirection: "desc",
        first: PAGE_SIZE,
        skip: 0,
      }, { subscribe: true }),

      // the list of preboosted proposals
      dao.proposals({
        where: { scheme: schemeId, stage: IProposalStage.PreBoosted },
        orderBy: "preBoostedAt",
      }, { subscribe: true }),

      // the list of boosted proposals
      dao.proposals({
        // eslint-disable-next-line @typescript-eslint/camelcase
        where: { scheme: schemeId, stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod] },
        orderBy: "boostedAt",
      }, { subscribe: true}),
      // big subscription query to make all other subscription queries obsolete
      arc.getObservable(bigProposalQuery, {subscribe: true}) as Observable<Proposal[]>,
    );
  },

  getFetchMoreObservable: (props: IExternalProps, data: SubscriptionData) => {
    const dao = props.daoState.dao;

    return dao.proposals({
      // eslint-disable-next-line @typescript-eslint/camelcase
      where: { scheme: props.scheme.id, stage: IProposalStage.Queued },
      orderBy: "confidence",
      orderDirection: "desc",
      first: PAGE_SIZE,
      skip: data[0].length,
    }, { subscribe: true, fetchAllData: true });
  },

  fetchMoreCombine: (prevState: SubscriptionData, newData: Proposal[]) => {
    return [prevState[0].concat(newData), prevState[1], prevState[2], []];
  },
});
//@ts-ignore
export default connect(null, mapDispatchToProps)(withTranslation()(SubscribedSchemeProposalsPage));
