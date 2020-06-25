import * as React from "react";
import { useEffect, useState, useContext} from "react";
import * as moment  from "moment";
import { getProfile, getConfig } from '3box';
import { Comment, Tooltip, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

import { ThreeBoxContext } from ".";
import AccountImage from "../../Account/AccountImage";

interface ThreeBoxMessageListProps {
  author: string;
  timestamp: number;
  isModerator: boolean;
  onRemoveMessage: (postId: string) => void;
  postId: string;
  message: string;
}

const ThreeBoxMessageList =({  author, message, timestamp, postId, onRemoveMessage, isModerator}: ThreeBoxMessageListProps) =>{

  const { currDID } =useContext(ThreeBoxContext)

  const [profile, setProfile]= useState(null);
  const [personConfig, setPersonConfig]= useState(null);

  useEffect(()=>{
    onGetProfile()
  }, [])

  const onGetProfile = async () => {
    const person = await getProfile(author)
    const { links } = await getConfig(author)
    setProfile(person)
    setPersonConfig(links[0])
  }

  const RemoveIcon = () =>{
    return (
      <Popconfirm
        title="Are you sure delete this message?"
        onConfirm={() => onRemoveMessage(postId)}
        okText="Yes"
        cancelText="No"
      >
        <DeleteOutlined style={{ color:'hotpink' }} />
      </Popconfirm>
    )
  }

  return <Comment
    author={profile?.name}
    avatar={<AccountImage profile={profile} width={40} accountAddress={personConfig?.address}  />}
    actions={(currDID === personConfig?.did || isModerator) && [<RemoveIcon />]}
    content={<p>{message}</p>}
    datetime={
      <Tooltip
        title={moment(timestamp * 1000)
          .subtract(0, 'days')
          .format('YYYY-MMM-DD HH:mm:ss')}
      >
          <span>
            {moment(timestamp * 1000)
              .subtract(0, 'days')
              .fromNow()}
          </span>
      </Tooltip>
    }
  />
}

export default ThreeBoxMessageList
